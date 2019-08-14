/* global importScripts, workbox, idbKeyval */

importScripts(`idb-keyval-iife.min.js`)

const { NavigationRoute } = workbox.routing

const navigationRoute = new NavigationRoute(async ({ event }) => {
  let { pathname } = new URL(event.request.url)
  pathname = pathname.replace(new RegExp(`^%pathPrefix%`), ``)

  // Check for resources + the app bundle
  // The latter may not exist if the SW is updating to a new version
  const resources = await idbKeyval.get(`resources:${pathname}`)
  if (!resources || !(await caches.match(`%pathPrefix%/%appFile%`))) {
    return await fetch(event.request)
  }

  for (const resource of resources) {
    // As soon as we detect a failed resource, fetch the entire page from
    // network - that way we won't risk being in an inconsistent state with
    // some parts of the page failing.
    if (!(await caches.match(resource))) {
      return await fetch(event.request)
    }
  }

  const offlineShell = `%pathPrefix%/offline-plugin-app-shell-fallback/index.html`
  return await caches.match(offlineShell)
})

workbox.routing.registerRoute(navigationRoute)

const messageApi = {
  setPathResources(event, { path, resources }) {
    event.waitUntil(idbKeyval.set(`resources:${path}`, resources))
  },

  clearPathResources(event) {
    event.waitUntil(idbKeyval.clear())
  },
}

self.addEventListener(`message`, event => {
  const { gatsbyApi } = event.data
  if (gatsbyApi) messageApi[gatsbyApi](event, event.data)
})

// Another things
self.addEventListener('push', function (event) {
    const { gatsbyApi } = event.data
    console.log(data)
    var thisMessage = JSON.parse(event.data.text())
    console.log('[Service Worker] Push Received.');
    console.log('This message text: ' + thisMessage.text)
    console.log('URL: ' + thisMessage.url)
    console.log(`[Service Worker] Push had this data: "${event.data}"`);
    console.log('[Service Worker] as json: ' + JSON.stringify(thisMessage))
    const title = 'Gatsby + HTML5Up';
    const options = {
        body: thisMessage.text,
        // Custom-defined actions allow varied responses
        actions: [
            {
                action: 'engage-action',
                title: 'Engage',
            }
        ]
        // icon: 'images/icon.png',
        // badge: 'images/badge.png'
    }
    event.waitUntil(self.registration.showNotification(title, options));
})
self.addEventListener('notificationclick', function(event) {
    if (!event.action) {
        // Was a normal notification click
        console.log('Normal Notification Click.');
    } else {
        console.log('Action click on ' + event.action)
    }
    console.log('[Service Worker] Notification click Received.');
    event.notification.close();
})

/*self.addEventListener('push', function (e) {
  var options = {
    body: 'This notification was generated from a push!',
    icon: '/assets/pic01.jpg',
    vibrate: [100, 50, 100],
    actions: [
      {
        action: 'explore', title: 'Explore',
        icon: '/assets/checkmark.png'
      },
      {
        action: 'close', title: 'Close',
        icon: '/assets/xmark.png'
      },
    ]
  };
  e.waitUntil(
    self.registration.showNotification('Hello world!', options)
  );
});*/

