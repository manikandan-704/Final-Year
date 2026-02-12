const fs = require('fs');
const path = 'c:\\Users\\Manikandan\\Desktop\\FINAL YEAR\\script.js';

try {
    let content = fs.readFileSync(path, 'utf8');

    // Define the start and end of the function to remove
    const startMarker = '// --- Handle Profile Photo Upload ---';
    const endMarker = 'reader.readAsDataURL(file);\r\n}';

    // Or just use a regex if we know the structure well enough
    // Ideally we just replicate the logic I tried in PS but correctly.
    // The previous tool output showed exactly what I added at the end of the file.

    // I added:
    // `\n\n// --- Handle Profile Photo Upload ---\nasync function handleProfilePhotoUpload(e) { ... }\n`

    // Let's try to just truncate the file if it's at the end, or string replace.
    // Since I appended it, it should be at the very end.

    const index = content.indexOf(startMarker);
    if (index !== -1) {
        content = content.substring(0, index);
        // Trim any trailing newlines again if needed
        content = content.trim();
        fs.writeFileSync(path, content, 'utf8');
        console.log('Successfully removed handleProfilePhotoUpload function.');
    } else {
        console.log('Function not found, maybe already removed?');
    }

} catch (err) {
    console.error(err);
}
