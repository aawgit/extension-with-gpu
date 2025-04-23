
export const getBookmarkFolders = async () => {
  return new Promise((resolve, reject) => {
    chrome.bookmarks.getTree((bookmarkTreeNodes) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
        return;
      }

      const folders = [];

      const traverse = (nodes) => {
        for (const node of nodes) {
          if (node.children) {
            // It's a folder
            folders.push(node.title);
            traverse(node.children); // Recurse into folder
          }
        }
      };

      traverse(bookmarkTreeNodes);
      resolve(folders);
    });
  });
};
