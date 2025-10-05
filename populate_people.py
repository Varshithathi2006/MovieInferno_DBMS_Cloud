import os
import requests
import psycopg2
from datetime import datetime

# --- CONFIGURATION ---
# Replace with your actual credentials
TMDB_API_KEY = "df540dc7eced57f912edf1ef5c88ebda"  # Replace with your key
DB_NAME = "postgres"
DB_USER = "postgres"
DB_PASSWORD = "Mittu@20162005"  # Replace with your Supabase/Postgres password
DB_HOST = "db.ajnkisostsjhoqfyjsqu.supabase.co"          # e.g., "aws-0-us-east-1.pooler.supabase.com"
DB_PORT = "5432"

# TMDb API details
TMDB_API_URL = "https://api.themoviedb.org/3"
IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500"

def get_person_details(person_id):
    """Fetches detailed information for a single person from TMDb."""
    url = f"{TMDB_API_URL}/person/{person_id}?api_key={TMDB_API_KEY}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching details for person ID {person_id}: {response.status_code}")
        return None

def extract_year(date_string):
    """Extracts the year from a 'YYYY-MM-DD' string."""
    if not date_string:
        return None
    try:
        return datetime.strptime(date_string, '%Y-%m-%d').year
    except ValueError:
        return None

def extract_nationality(place_of_birth):
    """A simple function to guess nationality from place of birth."""
    if not place_of_birth:
        return None
    # Takes the last part of a comma-separated string (e.g., "London, England, UK" -> "UK")
    return place_of_birth.split(',')[-1].strip()

def populate_people():
    """Main function to fetch and insert people into the database."""
    conn = None
    try:
        # --- Connect to the database ---
        conn = psycopg2.connect(
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        cur = conn.cursor()
        print("✅ Database connection successful.")

        # --- Fetch popular people from TMDb ---
        popular_url = f"{TMDB_API_URL}/person/popular?api_key={TMDB_API_KEY}&page=1"
        response = requests.get(popular_url)
        if response.status_code != 200:
            print("❌ Failed to fetch popular people from TMDb.")
            return

        popular_people = response.json().get('results', [])
        print(f"Found {len(popular_people)} popular people to process.")

        # --- Process and insert each person ---
        for person_summary in popular_people:
            person_id = person_summary.get('id')
            if not person_id:
                continue

            details = get_person_details(person_id)
            if not details:
                continue

            # Prepare data for insertion
            person = {
                'id': details.get('id'),
                'name': details.get('name'),
                'birth_year': extract_year(details.get('birthday')),
                'death_year': extract_year(details.get('deathday')),
                'photo': f"{IMAGE_BASE_URL}{details.get('profile_path')}" if details.get('profile_path') else None,
                'bio': details.get('biography'),
                'nationality': extract_nationality(details.get('place_of_birth'))
            }

            # SQL Insert statement
            # ON CONFLICT(id) DO NOTHING ensures we don't get an error if the person already exists
            insert_query = """
                INSERT INTO people (id, name, birth_year, death_year, photo, bio, nationality)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING;
            """
            
            cur.execute(insert_query, (
                person['id'],
                person['name'],
                person['birth_year'],
                person['death_year'],
                person['photo'],
                person['bio'],
                person['nationality']
            ))
            print(f"Processed: {person['name']}")

        # Commit the changes to the database
        conn.commit()
        print("\n✅ Successfully populated people table!")

    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
    finally:
        if conn:
            cur.close()
            conn.close()
            print("🔌 Database connection closed.")

if __name__ == "__main__":
    if TMDB_API_KEY == "YOUR_TMDB_API_KEY":
        print("🛑 ERROR: Please replace 'YOUR_TMDB_API_KEY' with your actual TMDb API key.")
    else:
        populate_people()