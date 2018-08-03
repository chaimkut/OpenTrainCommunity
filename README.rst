Testing reStructuredText internal links in github:

Some forms documented as valid hyperlink references by http://docutils.sourceforge.net/docs/ref/rst/restructuredtext.html#hyperlink-targets :

Here is a link to target1_

Here is a link to a `phrase target 2`_ as per http://docutils.sourceforge.net/docs/ref/rst/restructuredtext.html#hyperlink-references

Here is a link to an `inline internal target 3`_ as per http://docutils.sourceforge.net/docs/ref/rst/restructuredtext.html#inline-internal-targets

Here is a link to anon-target-4-1__

Here is a link to anon-target-4-2__

Here is a link to `anonymous phrase target 5-1`__

Here is a link to `anonymous phrase target 5-2`__

Anonymous targets as per http://docutils.sourceforge.net/docs/ref/rst/restructuredtext.html#anonymous-hyperlinks

.. _target1:

Paragraph 1

.. _phrase target 2:

Paragraph 3

Here is a paragraph with an _`inline internal target 3`

.. __: 

Paragraph 4-1

__ 

Paragraph 4-2

.. __: 

Paragraph 5-1

__ 

Paragraph 5-2