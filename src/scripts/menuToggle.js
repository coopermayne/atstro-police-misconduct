document.addEventListener("DOMContentLoaded", () => {
    const menuToggle = document.getElementById("menu-toggle");
    const menuOpenIcon = document.getElementById("menu-open-icon");
    const menuCloseIcon = document.getElementById("menu-close-icon");
    const mobileMenu = document.getElementById("mobile-menu");
    const mobileMenuOverlay = document.getElementById('mobile-menu-overlay');


    menuToggle.addEventListener("click", () => {
        // Toggle the mobile menu visibility
        mobileMenu.classList.toggle("hidden");
        mobileMenuOverlay.classList.toggle('hidden');

        // Toggle the visibility of the icons
        menuOpenIcon.classList.toggle("hidden");
        menuCloseIcon.classList.toggle("hidden");
    });

    mobileMenuOverlay.addEventListener('click', () => {
        // Hide the mobile menu and overlay when the overlay is clicked
        mobileMenu.classList.toggle("hidden");
        mobileMenuOverlay.classList.toggle('hidden');

        // Show the open icon and hide the close icon
        menuOpenIcon.classList.toggle("hidden");
        menuCloseIcon.classList.toggle("hidden");
    });
});
