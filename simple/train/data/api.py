from models import Sample, Trip, Route
from django.http import HttpResponse, Http404
import cache_utils
import django.db
import time

def json_resp(obj, status=200):
    import json

    dumped_content = json.dumps(obj)
    return HttpResponse(content=dumped_content, content_type='application/json')


def benchit(func):
    def wrap(*args,**kwargs):
        t1 = time.time()
        result = func(*args,**kwargs)
        t2 = time.time()
        print '%s took %.2f' % (func.__name__,t2-t1)
        return result
    return wrap

@cache_utils.cacheit
def get_stops(req):
    import services

    stops = services.get_stops()
    stops.sort(key=lambda x: x['stop_name'])
    return json_resp(stops)


def get_trip(req, trip_id):
    from models import Trip

    try:
        trip = Trip.objects.get(id=trip_id)
    except Trip.DoesNotExist:
        return json_resp({'error': '404',
                          'trip_id': trip_id},
                         status=404)
    return json_resp(trip.to_json());


@cache_utils.cacheit
def get_all_routes(req):
    from django.db.models import Count

    routes = list(Route.objects.all().order_by('id').annotate(trips_count=Count('trip')))
    result = []
    for r in routes:
        # stop_ids = r.stop_ids
        # stops = [{'stop_id': stop_id} for stop_id in stop_ids]
        result.append(
            {'stop_ids': r.stop_ids,
             'count': r.trips_count}
        )
    return json_resp(result)


def contains_stops(route, stop_ids):
    route_stop_ids = route.stop_ids
    try:
        first_index = route_stop_ids.index(stop_ids[0])
    except ValueError:
        return False
    return route_stop_ids[first_index:len(stop_ids) + first_index] == stop_ids


def find_all_routes_with_stops(stop_ids):
    routes = Route.objects.all()
    result = [r for r in routes if contains_stops(r, stop_ids)]
    return result


WEEK_DAYS = [1, 2, 3, 4, 5, 6, 7]
HOURS = [(4, 7),
         (7, 9),
         (9, 12),
         (12, 15),
         (15, 18),
         (18, 21),
         (21, 24),
         (24, 28),
]


def _check_hours():
    for idx, (h1, h2) in enumerate(HOURS):
        assert isinstance(h1, int)
        assert isinstance(h2, int)
        if idx > 0:
            assert h1 == HOURS[idx - 1][1]


_check_hours()


@cache_utils.cacheit
def get_path_info(req):
    stop_ids = [int(s) for s in req.GET['stop_ids'].split(',')]
    stats = _get_path_info_full(stop_ids)
    stat = [stat for stat in stats if stat['info']['hours'] == 'all' and stat['info']['week_day'] == 'all'][0]['stops']
    return json_resp(stat)


@cache_utils.cacheit
@benchit
def get_path_info_full(req):
    stop_ids = [int(s) for s in req.GET['stop_ids'].split(',')]
    stats = _get_path_info_full(stop_ids)
    stats.sort(key=_get_info_sort_key)
    return json_resp(stats)

def _get_info_sort_key(stat):
    info = stat['info']
    hours = info['hours'] if info['hours'] != 'all' else (1000,1000)
    week_day = info['week_day'] if info['week_day'] != 'all' else 1000
    return week_day,hours


def _get_path_info_full(stop_ids):
    # find all routes whose contains these stop ids
    routes = find_all_routes_with_stops(stop_ids)
    trips = []
    for r in routes:
        trips.extend(list(r.trip_set.filter(valid=True)))

    table = _get_stats_table(stop_ids, trips)

    stats = _complete_table(table,stop_ids)

    return stats

def _find_relevant_entries(table,week_day,hours):
    result = []
    for entry in table:
        if hours != 'all':
            hours_range = [h%24 for h in range(hours[0],hours[1])]
        if week_day == 'all' or entry['week_day_pg'] == week_day - 1:
            if hours == 'all' or entry['hour_pg'] in hours_range:
                result.append(entry)
    return result

def _avg_entries(stop_id, entries):
    result = dict()
    keys = ["arrival_on_time_pct",
            "arrival_late_pct",
            "departure_early_pct",
            "departure_on_time_pct",
            "arrival_early_pct",
            "departure_late_pct"]
    result['stop_id'] = stop_id
    total_num = sum(e.get('num_trips',0) for e in entries)
    for key in keys:
        if total_num != 0:
            count_key = key.replace('_pct','_count')
            sum_values = sum(entry.get(count_key,0) for entry in entries)
            result[key] = 1.0 * sum_values / total_num
        else:
            result[key] = 0
    return result

def _complete_table(table,stop_ids):
    result = []
    for week_day in WEEK_DAYS + ['all']:
        for hours in HOURS + ['all']:
            entries = _find_relevant_entries(table,week_day,hours)
            stops = []
            num_trips = None
            for stop_id in stop_ids:
                stop_id_entries = [entry for entry in entries if entry['stop_id'] == stop_id]
                prev_num_trips = num_trips
                num_trips = sum(e['num_trips'] for e in stop_id_entries)
                if prev_num_trips is not None:
                    assert num_trips == prev_num_trips,'inconsistency in num trips'
                if num_trips == 0:
                    stops.append({})
                else:
                    stops.append(_avg_entries(stop_id, stop_id_entries))
            stat = {
                'info': {
                    'num_trips': num_trips or 0,
                    'week_day': week_day,
                    'hours': list(hours) if isinstance(hours,tuple) else hours
                },
                'stops': stops
            }
            result.append(stat)
    return result

@benchit
def _get_stats_table(stop_ids, trips):
    early_threshold = -120
    late_threshold = 300
    trip_ids = [t.id for t in trips]
    first_stop_id = stop_ids[0]

    select_stmt = '''
        SELECT  count(s.stop_id) as num_trips,
                s.stop_id as stop_id,
                extract(dow from t.start_date) as week_day_pg,
                extract(hour from timezone('Asia/Jerusalem',s1.exp_departure)) as hour_pg,
                sum(case when s.delay_arrival <= %(early_threshold)s then 1.0 else 0.0 end)::float as arrival_early_count,
                sum(case when s.delay_arrival > %(early_threshold)s and s.delay_arrival < %(late_threshold)s then 1.0 else 0.0 end)::float as arrival_on_time_count,
                sum(case when s.delay_arrival >= %(late_threshold)s then 1.0 else 0.0 end)::float as arrival_late_count,

                sum(case when s.delay_departure <= %(early_threshold)s then 1.0 else 0.0 end)::float as departure_early_count,
                sum(case when s.delay_departure > %(early_threshold)s and s.delay_departure < %(late_threshold)s then 1.0 else 0.0 end)::float as departure_on_time_count,
                sum(case when s.delay_departure >= %(late_threshold)s then 1.0 else 0.0 end)::float as departure_late_count

        FROM    data_sample as s JOIN data_trip as t
        ON s.trip_id = t.id
        JOIN data_sample as s1
        ON s1.trip_id = t.id
        WHERE s1.stop_id = %(first_stop_id)s
        AND   s.stop_id = ANY (ARRAY[%(stop_ids)s])
        AND     s.valid
        AND     t.id = ANY (ARRAY[%(trip_ids)s])
        GROUP BY s.stop_id,week_day_pg,hour_pg
    '''
    select_kwargs = {
        'early_threshold': early_threshold,
        'late_threshold': late_threshold,
        'stop_ids': stop_ids,
        'trip_ids': trip_ids,
        'first_stop_id': first_stop_id
    }

    cursor = django.db.connection.cursor()
    cursor.execute(select_stmt,select_kwargs)

    cols = [
        'num_trips',
        'stop_id',
        'week_day_pg',
        'hour_pg',
        'arrival_early_count',
        'arrival_on_time_count',
        'arrival_late_count',
        'departure_early_count',
        'departure_on_time_count',
        'departure_late_count',
    ]

    result = []
    for row in cursor:
        stat = dict(zip(cols, row))
        result.append(stat)
    return result


