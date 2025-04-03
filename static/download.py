import os
import zipfile
import shutil
from flask import send_file, current_app

def create_download_zip():
    """Erstellt eine ZIP-Datei mit dem gesamten Projektcode."""
    # Verwende einen festen Pfad im static-Verzeichnis
    current_dir = os.path.abspath(os.path.dirname(__file__))
    zip_filename = "schadensbericht_app.zip"
    zip_path = os.path.join(current_dir, zip_filename)
    
    try:
        # Absoluten Pfad zur Anwendung ermitteln
        app_dir = os.path.dirname(current_dir)  # Übergeordnetes Verzeichnis
        
        print(f"Aktuelles Verzeichnis: {current_dir}")
        print(f"App-Verzeichnis: {app_dir}")
        print(f"ZIP-Datei wird erstellt: {zip_path}")
        
        # Ordner, die in die ZIP-Datei aufgenommen werden sollen
        dirs_to_include = ["static", "templates"]
        
        # Dateien im Hauptverzeichnis, die in die ZIP-Datei aufgenommen werden sollen
        files_to_include = ["app.py", "main.py", "requirements.txt"]
        
        # Erstelle requirements.txt, wenn sie nicht existiert
        requirements_path = os.path.join(app_dir, "requirements.txt")
        if not os.path.exists(requirements_path):
            with open(requirements_path, 'w') as req_file:
                req_file.write("flask\n")
                req_file.write("flask-sqlalchemy\n")
                req_file.write("gunicorn\n")
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Dateien im Hauptverzeichnis hinzufügen
            for file in files_to_include:
                file_path = os.path.join(app_dir, file)
                if os.path.exists(file_path):
                    # Speichere ohne Pfad
                    zipf.write(file_path, arcname=os.path.basename(file_path))
                    print(f"Hinzugefügt: {file_path} als {os.path.basename(file_path)}")
            
            # Ordner mit Unterordnern hinzufügen
            for dir_name in dirs_to_include:
                dir_path = os.path.join(app_dir, dir_name)
                if os.path.exists(dir_path) and os.path.isdir(dir_path):
                    for root, dirs, files in os.walk(dir_path):
                        for file in files:
                            absolute_file_path = os.path.join(root, file)
                            # Vermeide Rekursion - nicht die aktuelle ZIP-Datei einpacken
                            if (absolute_file_path == zip_path or 
                                absolute_file_path.endswith('.pyc') or 
                                '__pycache__' in absolute_file_path):
                                continue
                                
                            # Relativer Pfad im ZIP beginnend vom Projektroot
                            relative_path = os.path.relpath(absolute_file_path, app_dir)
                            zipf.write(absolute_file_path, arcname=relative_path)
                            print(f"Hinzugefügt: {absolute_file_path} als {relative_path}")
                else:
                    print(f"WARNUNG: Verzeichnis {dir_path} nicht gefunden")
        
        print(f"ZIP-Datei erfolgreich erstellt: {zip_path}")
        file_size = os.path.getsize(zip_path)
        print(f"ZIP-Datei Größe: {file_size} Bytes")
        return zip_path
        
    except Exception as e:
        print(f"Fehler beim Erstellen der ZIP-Datei: {e}")
        # Erstelle Minimal-ZIP-Datei im Fehlerfall, damit der Download nicht abbricht
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            info_path = os.path.join(current_dir, "info.txt")
            with open(info_path, 'w') as f:
                f.write("Es ist ein Fehler beim Erstellen der ZIP-Datei aufgetreten.\n")
                f.write(f"Fehler: {str(e)}\n")
            zipf.write(info_path, "info.txt")
            os.remove(info_path)
        return zip_path