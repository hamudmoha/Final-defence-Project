import os

filename = r"c:/Users/post_lab/Downloads/Final-Year-Project-main/Final-Year-Project/frontend/src/Component/CampAdmin/Pages/SystemSettings.jsx"
with open(filename, 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_idx = next(i for i, l in enumerate(lines) if '{/* Personal Section */}' in l)
end_idx = next(i for i, l in enumerate(lines) if '{/* Desktop Header */}' in l)
dest_idx = next(i for i, l in enumerate(lines) if '{/* Danger Zone Section */}' in l)

print(f"start: {start_idx}, end: {end_idx}, dest: {dest_idx}")

chunk_to_move = lines[start_idx:end_idx]
lines_new = lines[:start_idx] + lines[end_idx:dest_idx] + chunk_to_move + lines[dest_idx:]

with open(filename, 'w', encoding='utf-8') as f:
    f.writelines(lines_new)

print("File updated successfully.")
