<script>
    const toggle = document.getElementById('darkmode-toggle');
    function handleBackgroundChange(event){
        if (toggle.checked){
            document.documentElement.setAttribute('theme', 'dark');
            localStorage.setItem('theme', 'dark');
        }
        else{
            document.documentElement.setAttribute('theme', 'light');
            localStorage.setItem('theme', 'light');
        }
    }
    toggle.addEventListener('change', handleBackgroundChange);
    handleBackgroundChange();
</script>   