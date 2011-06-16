#!/bin/bash
`rm secret_social.xpi`;
`find -iname \* -not -name \*.sh -not -name \*~ -not -name .\* | zip secret_social.xpi -@`;
