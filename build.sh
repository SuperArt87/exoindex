#!/usr/bin/env bash
# Build-script voor Render -- draait bij elke deploy.
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate
