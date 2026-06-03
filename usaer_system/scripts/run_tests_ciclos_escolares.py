import os
import sys
import subprocess

def run_tests():
    print("Running: python manage.py test ciclos_escolares in C:\\Users\\LENOVO RYZEN RTX\\Documents\\projects\\usaer\\usaer7607\\usaer_system")
    
    # Setup environment variables for testing
    env = os.environ.copy()
    env['SECRET_KEY'] = 'testing_secret_key_7607'
    env['DEBUG'] = 'True'
    
    try:
        # Run the test command
        result = subprocess.run(
            ['python', 'manage.py', 'test', 'ciclos_escolares'],
            env=env,
            cwd=r'C:\Users\LENOVO RYZEN RTX\Documents\projects\usaer\\usaer7607\\usaer_system',
            capture_output=False,
            text=True
        )
        sys.exit(result.returncode)
    except Exception as e:
        print(f"Error running tests: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
