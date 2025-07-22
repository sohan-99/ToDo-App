#!/bin/bash

# Script to remove comments from typescript/javascript files
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.mjs" \) -exec sed -i \
    -e 's|\/\/.*$||g' \
    -e 's|\/\*.*\*\/||g' \
    -e '/^[ \t]*\/\*/,/\*\//d' \
    -e 's|[ \t]*$||g' \
    -e '/^$/d' \
    {} \;

# Special handling for CSS files
find . -type f -name "*.css" -exec sed -i \
    -e 's|\/\*.*\*\/||g' \
    -e '/^[ \t]*\/\*/,/\*\//d' \
    -e 's|[ \t]*$||g' \
    {} \;

echo "Comments have been removed from the codebase."
# ./remove_comments.sh