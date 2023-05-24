#!/bin/bash
# This script installs a single pip package on a SageMaker Studio Kernel Application

set -eux

# PARAMETERS
PACKAGE=pyarrow

pip install --upgrade $PACKAGE