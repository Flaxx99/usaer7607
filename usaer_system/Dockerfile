# usaer_system/Dockerfile
FROM python:3.12-slim

# Evitar que Python genere archivos .pyc y que el output se bufferice
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

WORKDIR /app

# Instalar dependencias del sistema necesarias para psycopg2 y otras libs
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalar dependencias de Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el resto del código
COPY . .

# Exponer el puerto de Django
EXPOSE 8000

# Comando por defecto (se puede sobreescribir en compose)
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
