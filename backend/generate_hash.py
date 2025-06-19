from werkzeug.security import generate_password_hash

# Ganti 'yourpassword' dengan password yang ingin di-hash
# password = 'admin123'  # Contoh password
# hashed_password = generate_password_hash(password)

# print("Plain Password:", password)
# print("Hashed Password:", hashed_password)

password = 'diza123'
hashed_password = generate_password_hash(password)

print("Plain Password:", password)
print("Hashed Password:", hashed_password)