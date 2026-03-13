import sqlite3
import os
import sys

def unblock_user():
    # Путь к базе данных
    DB_PATH = '/data/database.db'
    
    # Email пользователя для разблокировки
    target_email = 'fedcenkokirill68@gmail.com'
    
    print(f"Пытаюсь разблокировать пользователя: {target_email}")
    print(f"Путь к БД: {DB_PATH}")
    
    # Проверяем существует ли файл базы данных
    if not os.path.exists(DB_PATH):
        print(f"ОШИБКА: Файл базы данных не найден по пути {DB_PATH}")
        # Попробуем найти базу данных в других местах
        possible_paths = [
            '/app/database.db',
            './database.db',
            '../database.db',
            os.path.join(os.path.dirname(__file__), 'database.db')
        ]
        
        for path in possible_paths:
            if os.path.exists(path):
                DB_PATH = path
                print(f"Нашел базу данных: {DB_PATH}")
                break
        else:
            print("База данных не найдена нигде!")
            return False
    
    try:
        # Подключаемся к базе данных
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Сначала проверим, есть ли такой пользователь
        cursor.execute("SELECT id, email, warnings, is_blocked FROM users WHERE email = ?", (target_email,))
        user = cursor.fetchone()
        
        if not user:
            print(f"Пользователь {target_email} не найден в базе данных!")
            
            # Покажем всех пользователей для проверки
            cursor.execute("SELECT id, email, warnings, is_blocked FROM users LIMIT 5")
            users = cursor.fetchall()
            if users:
                print("Первые 5 пользователей в базе:")
                for u in users:
                    print(f"  ID: {u[0]}, Email: {u[1]}, Предупреждений: {u[2]}, Заблокирован: {u[3]}")
            else:
                print("В базе данных нет пользователей!")
            return False
        
        print(f"Найден пользователь: ID={user[0]}, Email={user[1]}, Предупреждений={user[2]}, Заблокирован={user[3]}")
        
        if user[3] == 0:
            print("Пользователь уже разблокирован!")
            return True
        
        # Разблокируем пользователя
        cursor.execute("UPDATE users SET is_blocked = 0, warnings = 0 WHERE email = ?", (target_email,))
        conn.commit()
        
        if cursor.rowcount > 0:
            print(f"✓ Пользователь {target_email} успешно разблокирован!")
            
            # Проверим результат
            cursor.execute("SELECT warnings, is_blocked FROM users WHERE email = ?", (target_email,))
            result = cursor.fetchone()
            print(f"Текущее состояние: Предупреждений={result[0]}, Заблокирован={result[1]}")
            return True
        else:
            print("Не удалось разблокировать пользователя")
            return False
            
    except sqlite3.Error as e:
        print(f"Ошибка базы данных: {e}")
        return False
    except Exception as e:
        print(f"Неожиданная ошибка: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()
            print("Соединение с БД закрыто")

def check_database_structure():
    """Проверяет структуру базы данных"""
    DB_PATH = '/data/database.db'
    if not os.path.exists(DB_PATH):
        print("База данных не найдена")
        return
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Проверяем структуру таблицы users
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        print("Структура таблицы users:")
        for col in columns:
            print(f"  {col[1]} ({col[2]})")
            
    except Exception as e:
        print(f"Ошибка при проверке структуры: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 50)
    print("СКРИПТ РАЗБЛОКИРОВКИ ПОЛЬЗОВАТЕЛЯ")
    print("=" * 50)
    
    # Сначала проверим структуру
    check_database_structure()
    
    print("\n" + "=" * 50)
    # Затем разблокируем
    success = unblock_user()
    
    if success:
        print("\n✓ РАЗБЛОКИРОВКА ВЫПОЛНЕНА УСПЕШНО!")
    else:
        print("\n✗ НЕ УДАЛОСЬ РАЗБЛОКИРОВАТЬ ПОЛЬЗОВАТЕЛЯ")
    
    print("=" * 50)
