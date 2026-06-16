@echo off
cd ..\usaer_system
set DJANGO_SETTINGS_MODULE=usaer_system.e2e_settings
set DEBUG=True
set SECRET_KEY=django-insecure-e2e-key-12345
python manage.py migrate
python manage.py seed_e2e
python manage.py runserver 8000
