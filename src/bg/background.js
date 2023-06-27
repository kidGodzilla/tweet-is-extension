(function() {
	var onHeadersReceived = function (details) {
		for (var i = 0; i < details.responseHeaders.length; i++) {
			if (details.responseHeaders[i].name.toLowerCase() === 'content-security-policy') {
				details.responseHeaders[i].value = '';
			}
		}

		return {
			responseHeaders: details.responseHeaders
		};
	};

	var onHeaderFilter = { urls: ['*://*/*'], types: ['main_frame', 'sub_frame'] };
	chrome.webRequest.onHeadersReceived.addListener(
		onHeadersReceived, onHeaderFilter, ['blocking', 'responseHeaders']
	);
})();