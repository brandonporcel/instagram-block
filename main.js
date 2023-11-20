chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message !== "TabUpdated") return;

  function uriCheck(_uri) {
    const links = _uri.split("/");
    for (let i = 0; i < links.length; i++) {
      if (
        links[i] === "reels" &&
        links[i + 1] !== undefined &&
        links[i + 1] !== ""
      ) {
        console.log(links[i + 1], "links[i + 1]");
        return "https://www.instagram.com/reel/" + links[i + 1];
      }
    }
    return null;
  }

  const uri = uriCheck(location.href);
  if (uri !== null) {
    location = uri;
  }

  async function waitForElement(selector) {
    return new Promise((resolve) => {
      const observer = new MutationObserver((mutationsList, observer) => {
        const elementoHijo = document.querySelector(selector);
        if (elementoHijo) {
          observer.disconnect();
          resolve(elementoHijo);
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
  function getParentByHierarchy(element, levels) {
    let parent = element;
    for (let i = 0; i < levels; i++) {
      parent = parent?.parentNode;
    }
    return parent;
  }

  function hideElement(element, displayValue = "none") {
    if (element) {
      element.style.display = displayValue;
    }
  }

  (async () => {
    const reelSelector = await waitForElement('a[href="/reels/"]');
    const reelButton = getParentByHierarchy(reelSelector, 3);
    hideElement(reelButton);
  })();

  function containsText(element, text) {
    return element.innerText.includes(text);
  }

  async function main() {
    const elem = await waitForElement('main[role="main"]');
    if (location.href === "https://www.instagram.com/explore/") {
      hideElement(elem);
    } else if (location.href === "https://www.instagram.com/explore/search/") {
      hideElement(elem, "block");
    }
  }

  function checkLimit(altText) {
    const imageLimit = document.querySelector(`img[alt='${altText}']`);
    const limit = getParentByHierarchy(imageLimit, 2);

    if (limit) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio === 1.0) {
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            });
            observer.disconnect();
          }
        });
      });

      observer.observe(limit);
    }
  }

  function hideFollowPosts() {
    const spans = document.querySelectorAll("._aar2");
    spans.forEach((span) => {
      if (containsText(span, "Seguir") || containsText(span, "Follow")) {
        desiredSpans.push(span);
        const followPost = getParentByHierarchy(span, 7);
        hideElement(followPost);
      }
    });
  }

  desiredHeaders = [];
  function hideSponsoredPosts() {
    const headers = document.querySelectorAll("._aaqw");

    headers.forEach((header) => {
      const spans = header.querySelectorAll("span");
      spans.forEach((span) => {
        if (
          span.innerHTML.includes("Original audio") ||
          span.innerHTML.includes("Sponsored")
        ) {
          const sponsoredArticle = getParentByHierarchy(span, 9);
          hideElement(sponsoredArticle);
        }
      });
    });
  }

  let desiredSpans = [];
  function handleScroll() {
    if (location.href !== "https://www.instagram.com/") return;
    checkLimit("Marca de verificación");
    checkLimit("Checkmark");
    const spans = document.querySelectorAll("span");

    spans.forEach((span) => {
      if (
        containsText(span, "Publicaciones sugeridas") ||
        containsText(span, "Suggested Posts")
      ) {
        desiredSpans.push(span);

        const fatherElem = getParentByHierarchy(span, 1);
        hideElement(fatherElem);
        hideElement(fatherElem?.nextElementSibling);
      }
    });

    hideFollowPosts();
    hideSponsoredPosts();
  }

  window.addEventListener("scroll", handleScroll);
  main();
});
