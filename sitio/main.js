const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    if ('IntersectionObserver' in window && !reducedMotion.matches) {
      const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
      }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
      document.documentElement.classList.add('js-motion');
      document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
    }
    const topbar = document.querySelector('.topbar');
    const updateTopbar = () => topbar.classList.toggle('scrolled', scrollY > 8);
    addEventListener('scroll', updateTopbar, { passive: true });
    updateTopbar();
    document.querySelectorAll('details.document').forEach((details) => {
      const summary = details.querySelector('summary');
      let animation;
      let closing = false;
      summary.addEventListener('click', (event) => {
        if (reducedMotion.matches || !details.animate) return;
        event.preventDefault();
        const start = details.offsetHeight;
        const shouldOpen = !details.open || closing;
        if (animation) animation.cancel();
        closing = !shouldOpen;
        details.style.overflow = 'hidden';
        details.open = true;
        const end = shouldOpen ? details.scrollHeight : summary.offsetHeight + 2;
        animation = details.animate({ height: [start + 'px', end + 'px'] }, { duration: shouldOpen ? 480 : 320, easing: shouldOpen ? 'cubic-bezier(.22, 1, .36, 1)' : 'cubic-bezier(.65, 0, .35, 1)' });
        animation.onfinish = () => { details.open = shouldOpen; details.style.overflow = ''; closing = false; animation = null; };
      });
    });
