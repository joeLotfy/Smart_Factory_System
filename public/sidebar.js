document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const toggleBtn = document.getElementById('toggleBtn');
    const currentPath = window.location.pathname;
    const savedState = localStorage.getItem('sidebarCollapsed'); //restore saved state

    if (savedState === 'true') {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('collapsed');
    }


    document.querySelectorAll('.menu a').forEach(link => {
        const linkPath = link.getAttribute('data-path');

        if(linkPath && currentPath === linkPath) {
            link.classList.add('active');
        }
    });

    console.log(sidebar, mainContent, toggleBtn);

    toggleBtn.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('collapsed');

        //save state
        const isCollapsed = sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    });
});