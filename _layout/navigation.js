const Navigation = (config) => {
  return `<nav id="MagicMenu" class="topnav navbar navbar-expand-lg navbar-light bg-white fixed-top">
    <div class="container">
        <a class="navbar-brand" href="/">
            <span style="font-weight: bold;">${config.title}</span>
        </a>
        <button class="navbar-toggler collapsed" type="button" data-toggle="collapse" data-target="#navbarColor02" aria-controls="navbarColor02" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="navbar-collapse collapse" id="navbarColor02" style="">
            <ul class="navbar-nav mr-auto d-flex align-items-center">
                <li class="nav-item"><a class="nav-link" href="/">Home</a></li>
                <li class="nav-item"><a class="nav-link" href="/p/contact/">Contact</a></li>
                <li class="nav-item"><a class="nav-link" href="/p/copyright/">Copyright</a></li>
                <li class="nav-item"><a class="nav-link" href="/p/dmca/">DMCA</a></li>
                <li class="nav-item"><a class="nav-link" href="/p/privacy/">Privacy Policy</a></li>
            </ul>
            <ul class="navbar-nav ml-auto d-flex align-items-center">
                <form class="bd-search hidden-sm-down" role="search" method="get" action="https://google.com/search">
                    <input type="text" class="form-control text-small" name="q" value="" placeholder="Type keyword and enter...">
                    <input type="hidden" name="sitesearch" value="${
                      new URL(config.baseUrl).hostname
                    }">
                </form>
            </ul>
        </div>
    </div>
</nav>`;
};

module.exports = Navigation;
