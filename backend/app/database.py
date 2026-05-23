import psycopg2

conn = psycopg2.connect(database = "edutrack", 
                        user = "postgres", 
                        host= 'localhost',
                        password = "Debra@46",
                        port = 5432)

if conn:
    print("Database connection successful")