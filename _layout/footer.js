const Footer = (config) => {
  return `
<footer class="bg-white border-top p-3 text-muted small">
    <div class="container">
        <div class="row align-items-center justify-content-between">
            <div>
                <span class="navbar-brand mr-2"><strong><a href="/">${config.title}</a></strong></span> Copyright &copy; <script>document.write(new Date().getFullYear())</script>
            </div>
            <div>
			    <a target="_blank" class="text-secondary font-weight-bold" href="/feed">RSS Feed</a>
		    </div>
        </div>
    </div>
</footer>
<script async="async" src="https://code.jquery.com/jquery-3.3.1.min.js" integrity="sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=" crossorigin="anonymous"></script>
<script async="async" src="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/js/bootstrap.min.js" integrity="sha384-B0UglyR+jN6CkvvICOB2joaf5I4l3gm9GU6Hc1og6Ls7i6U/mkkaduKaBhlAXv9k" crossorigin="anonymous"></script>
<script async="async" src="/theme.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.0/jquery.min.js" integrity="sha256-xNzN2a4ltkB44Mc/Jz3pT4iU1cmeR0FkXs4pru/JxaQ=" crossorigin="anonymous"></script>`;
};

module.exports = Footer;
