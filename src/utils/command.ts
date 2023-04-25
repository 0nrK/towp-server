function hasWordStartingWithSlash(data: string): boolean {
    // Split the message into words
    const words = data.split(' ');

    // Loop through each word
    for (const word of words) {
        // Check if the word starts with a slash ("/")
        if (word.startsWith('/')) {
            return true; // Return true if a word is found
        }
    }

    return false; // Return false if no word is found
}
