// Select the toggle button in the navigation
const themeToggle = document.querySelector('#theme-toggle');

// Check if dark mode is already enabled in localStorage
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
}

// Add event listener to toggle button
themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');

    // Save the current theme to localStorage
    if (document.documentElement.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
    } else {
        localStorage.setItem('theme', 'light');
    }
});