#!/bin/bash

# GitHub username and repository name
REMOTE_URL=$(git config --get remote.origin.url)

# Extract GitHub username and repository name from the remote URL
USERNAME=$(echo "$REMOTE_URL" | sed -n 's/.*github.com[:/]\(.*\)\/.*/\1/p')
REPO=$(echo "$REMOTE_URL" | sed -n 's/.*github.com\/.*\/\(.*\)/\1/p')

# Get the current commit SHA
COMMIT_SHA=$(git rev-parse HEAD)

git fetch --depth=2

# Function to append line to diff content, splitting if necessary
append_line() {
    local line=$1
    local max_length=$2
    local num_lines=$(echo "$line" | awk -v max_len="$max_length" '{print int((length + max_len - 1) / max_len)}')
    local i=1
    while [[ $i -le $num_lines ]]; do
        local start=$(( (i - 1) * max_length + 1 ))
        local end=$(( i * max_length ))
        local chunk="${line:start:max_length}"
        diff_content+=("$chunk")
        ((i++))
    done
}

# Function to split the diff content into chunks
split_diff() {
    local diff_content=("$@")
    local max_length=350  # Maximum length for each chunk
    local num_lines=$(echo "${diff_content[@]}" | wc -l)
    local lines_per_chunk=$(( max_length / num_lines + 1 ))
    echo "${diff_content[@]}" | awk -v max_len="$lines_per_chunk" '
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

# Initialize an empty array to store diff chunks
diff_chunks=()

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
            if [[ ${#line} -gt 350 ]]; then
                # If line exceeds 350 characters, append line to diff content, splitting if necessary
                append_line "$line" 350
            else
                # Otherwise, simply append the line to the diff content
                diff_content+=("$line")
            fi
            # Increment the total length
            total_length=$(( total_length + ${#line} ))
            # Check if total length exceeds the maximum
            if [[ $total_length -ge 350 ]]; then
                # Add the diff content to the array of chunks
                diff_chunks+=("${diff_content[@]}")
                # Reset the total length and content
                total_length=0
                diff_content=()
            fi
        fi
    fi
done <<< "$diff_output"

# Add the remaining diff content to the array of chunks
if [[ ${#diff_content[@]} -gt 0 ]]; then
    diff_chunks+=("${diff_content[@]}")
fi

# Iterate over the diff chunks and post comments to GitHub
for diff_chunk in "${diff_chunks[@]}"; do
    split_diff "${diff_chunk[@]}" | while IFS= read -r diff_chunk_split; do
        post_comment "$current_file" "$diff_chunk_split"
    done
done

# Disable dotglob option to revert to default behavior
shopt -u dotglob
