#!/bin/bash

# GitHub username and repository name
REMOTE_URL=$(git config --get remote.origin.url)

# Extract GitHub username and repository name from the remote URL
USERNAME=$(echo "$REMOTE_URL" | sed -n 's/.*github.com[:/]\(.*\)\/.*/\1/p')
REPO=$(echo "$REMOTE_URL" | sed -n 's/.*github.com\/.*\/\(.*\)/\1/p')

# Get the current commit SHA
COMMIT_SHA=$(git rev-parse HEAD)

git fetch --depth=2

# Store the output of `git diff HEAD^ HEAD` into a variable
diff_output=$(git diff HEAD^ HEAD)

# Variable to keep track of the current file being processed
current_file=""

# Iterate over the lines of the diff output
while IFS= read -r line; do
    # Check if the line starts with "diff --git", indicating a new file
    if [[ $line == "diff --git"* ]]; then
        # Extract the filename from the line
        file=$(echo "$line" | cut -d ' ' -f 3 | sed 's/^a\///')
        current_file=$(echo "${file//\//_}")
        echo "" > "$current_file.diff"
    elif [[ $line == "index "* || $line == "--- "* || $line == "+++ "* ]]; then
        # Skip these lines
        continue
    else
        # Write the line to the corresponding file
        echo "$line" >> "$current_file.diff"
    fi
done <<< "$diff_output"

# Function to post comment to GitHub
post_comment() {
    local filename=$1
    local diff_content=$2

    # Escape backslashes
    diff_content=$(echo "$diff_content" | sed 's/\\/\\\\/g')
    # Escape double quotes in the comment body
    diff_content=$(echo "$diff_content" | sed 's/"/\\"/g')


    # Create a comment body
    local comment_body=$(cat <<EOF
## Changes in $filename:

\`\`\`diff
$diff_content
\`\`\`
EOF
)
    # Replace newline characters with "\\n"
    comment_body=$(echo "$comment_body" | sed ':a;N;$!ba;s/\n/\\n/g')

    echo "{\"body\":\"$comment_body\"}"

    # Post the comment using cURL
    curl -L \
        -X POST \
        -H "Accept: application/vnd.github+json" \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "X-GitHub-Api-Version: 2022-11-28" \
        "https://api.github.com/repos/$USERNAME/$REPO/commits/$COMMIT_SHA/comments" \
        -d "{\"body\":\"$comment_body\"}"
}

# Enable dotglob option to include files starting with a dot
shopt -s dotglob

# Iterate over all .diff files in the current directory
for file in *.diff; do
    # Check if file exists and is a regular file
    if [[ -f "$file" ]]; then
        # Extract filename from the .diff file
        filename="${file%.diff}"
        # Read the content of the .diff file
        diff_content=$(cat "$file")
        # Post comment to GitHub
        post_comment "$filename" "$diff_content"
    fi
done

# Disable dotglob option to revert to default behavior
shopt -u dotglob
