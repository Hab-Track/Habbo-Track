#!/bin/bash

# GitHub username and repository name
REMOTE_URL=$(git config --get remote.origin.url)

# Extract GitHub username and repository name from the remote URL
USERNAME=$(echo "$REMOTE_URL" | sed -n 's/.*github.com[:/]\(.*\)\/.*/\1/p')
REPO=$(echo "$REMOTE_URL" | sed -n 's/.*github.com\/.*\/\(.*\)/\1/p')

# Get the current commit SHA
COMMIT_SHA=$(git rev-parse HEAD)

git fetch --depth=2

# Function to split the diff content into chunks
split_diff() {
    local diff_content=$1
    local max_length=350  # Maximum length for each chunk
    local num_lines=$(echo "$diff_content" | wc -l)
    local lines_per_chunk=$(( max_length / num_lines + 1 ))
    echo "$diff_content" | awk -v max_len="$lines_per_chunk" '
        {
            for (i = 1; i <= NF; i += max_len) {
                for (j = i; j < i + max_len && j <= NF; j++) {
                    printf "%s ", $j
                }
                printf "\n"
            }
        }
    '
}

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

    # Post the comment using cURL
    curl -L \
        -X POST \
        -H "Accept: application/vnd.github.v3+json" \
        -H "Authorization: Bearer $GITHUB_TOKEN" \
        -H "Content-Type: application/json" \
        "https://api.github.com/repos/$USERNAME/$REPO/commits/$COMMIT_SHA/comments" \
        -d "{\"body\":\"$comment_body\"}"
}

# Store the output of `git diff HEAD^ HEAD` into a variable
diff_output=$(git diff HEAD^ HEAD)

# Variable to keep track of the current file being processed
current_file=""

# Total length of lines processed
total_length=0

# Enable dotglob option to include files starting with a dot
shopt -s dotglob

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
    elif [[ $line != +* && $line != -* ]]; then
        # If the line doesn't start with + or -, skip it
        continue
    else
        # Write the non-empty line to the corresponding file
        if [[ -n "$line" ]]; then
            echo "$line" >> "$current_file.diff"
            # Increment the total length
            total_length=$(( total_length + ${#line} ))
            # Check if total length exceeds the maximum
            if [[ $total_length -ge 350 ]]; then
                # Read the content of the .diff file
                diff_content=$(cat "$current_file.diff")
                # Post comment to GitHub only if the diff content is not empty
                if [[ -n "$diff_content" ]]; then
                    split_diff "$diff_content" | while IFS= read -r diff_chunk; do
                        post_comment "$current_file" "$diff_chunk"
                    done
                fi
                # Reset the total length and content
                total_length=0
                echo "" > "$current_file.diff"
            fi
        fi
    fi
done <<< "$diff_output"

# Post remaining comments if any
for file in *.diff; do
    # Check if file exists and is a regular file
    if [[ -f "$file" ]]; then
        # Extract filename from the .diff file
        filename="${file%.diff}"
        # Read the content of the .diff file
        diff_content=$(cat "$file")
        # Post comment to GitHub only if the diff content is not empty
        if [[ -n "$diff_content" ]]; then
            post_comment "$filename" "$diff_content"
        fi
    fi
done

# Disable dotglob option to revert to default behavior
shopt -u dotglob
