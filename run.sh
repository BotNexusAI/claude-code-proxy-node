#!/bin/bash

# This script is a simple wrapper for the main Python CLI.
# It ensures that the command is run with python3 and forwards all arguments.
# For example: bash run.sh start --auto
set -e
exec python3 src/ccp/cli.py "$@"
