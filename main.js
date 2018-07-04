((doc, $, win, nav) => {

  win.addEventListener('load', () => {
    if ('serviceWorker' in nav) {
      nav.serviceWorker.register('sw.js')
      .then(reg => reg);
    }
  });

  const checkOnlineState = () => {
    const bodyClassList = doc.body.classList;
    if (nav.onLine) {
      bodyClassList.remove('offline')
    } else {
      message.hidden = false;
      bodyClassList.add('offline');
    }
  };
  checkOnlineState();

  ['online', 'offline'].forEach(state => {
    win.addEventListener(state, checkOnlineState);
  });

  const DEFAULT_VAL_1 = 'Donald Trump';
  const DEFAULT_VAL_2 = 'Barack Obama';

  const article1 = $('article1');
  const article2 = $('article2');
  const button = $('button');
  const form = $('form');
  const progress = $('progress');
  const views1 = $('views1');
  const views2 = $('views2');
  const results = $('results');
  const spinner = $('spinner');
  const message = $('message');

  const url = (_, article) => {
    article = article.trim();
    if (!article) {
      return false;
    }
    const start = `${new Date(new Date().setDate(new Date().getDate() - 1))
        .toISOString().replace(/-/g, '').split('T')[0]}00`;
    const end = `${new Date().toISOString().replace(/-/g, '').split('T')[0]}00`;
    return `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia.org/all-access/all-agents/${article.replace(/\s/g, '_')}/daily/${start}/${end}`;
  };

  article1.disabled = false;
  article1.value = DEFAULT_VAL_1;
  article2.disabled = false;
  article2.value = DEFAULT_VAL_2;
  button.disabled = false;

  [article1, article2].forEach(input => {
    input.addEventListener('focus', () => {
      if ((input.value === DEFAULT_VAL_1) || (input.value === DEFAULT_VAL_2)) {
        input.value = '';
        button.disabled = true;
      }
    });

    input.addEventListener('input', () => {
      if ((article1.value.trim().length + article2.value.trim().length > 1) &&
          (article1.value.trim() !== article2.value.trim())) {
        button.hidden = false;
        results.hidden = true;
        message.hidden = true;
        return button.disabled = false;
      }
      button.disabled = true;
    });
  });

  form.addEventListener('submit', async (submitEvent) => {
    submitEvent.preventDefault();

    const url1 = url`${article1.value}`;
    const url2 = url`${article2.value}`;
    if (!url1 || !url2) {
      return;
    }

    article1.disabled = true;
    article2.disabled = true;
    button.disabled = true;

    results.hidden = true;
    spinner.hidden = false;
    message.hidden = true;
    button.hidden = true;
    views1.classList.remove('winner');
    views2.classList.remove('winner');

    try {
      await Promise.all([
        fetch(url1).then(res => res.json()).then(data => data.items[0].views),
        fetch(url2).then(res => res.json()).then(data => data.items[0].views)
      ]).then(([res1, res2]) => {
        progress.max = res1 + res2;
        progress.value = res1;
        views1.textContent = res1;
        views2.textContent = res2;
        if (res1 > res2) {
          views1.classList.add('winner');
        } else {
          views2.classList.add('winner');
        }
      });
    } catch {
      progress.value = 50;
      progress.max = 100;
      views1.textContent = 0;
      views2.textContent = 0;
      message.hidden = false;
      message.innerHTML = `This battle can't be fought.`;
    } finally {
      article1.disabled = false;
      article2.disabled = false;
      results.hidden = false;
      spinner.hidden = true;
    }
  });

})(document, document.getElementById.bind(document), window, navigator);
