#!/usr/bin/env python3
"""Wrapper to run RAC tests with required environment variables.

This script sets SECRET_KEY and DEBUG in the subprocess env and runs
`python manage.py test rac` from the usaer_system working directory so Django
can load settings and the test runner runs reliably from the agent.

Usage: python usaer_system/scripts/run_tests_rac.py
"""
import os
import sys
import subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
manage_dir = ROOT  # usaer_system directory

env = os.environ.copy()
# Defaults for testing — override by setting env vars externally if needed
env.setdefault('SECRET_KEY', 'testing_secret_key_7607')
env.setdefault('DEBUG', 'True')

cmd = [sys.executable, 'manage.py', 'test', 'rac']

print(f"Running: {' '.join(cmd)} in {manage_dir}")
proc = subprocess.run(cmd, cwd=manage_dir, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
print(proc.stdout)
sys.exit(proc.returncode)
