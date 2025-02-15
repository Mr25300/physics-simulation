export class TabManager {
  container: HTMLElement;
  tabText: HTMLElement;
  oldIndex: number;
  oldLength: number;

  constructor(options: { containerSelector: string; tabTextSelector: string }) {
    const container = document.querySelector(options.containerSelector);
    const tabText = document.querySelector(options.tabTextSelector);

    if (!container || !tabText) {
      throw new Error("Container or tabText element not found.");
    }

    this.container = container as HTMLElement;
    this.tabText = tabText as HTMLElement;
    this.oldIndex = 0;
    this.oldLength = 0;
  }

  /**
   * Initializes the tab interface.
   * @param tabContents Object mapping tab keys to their content.
   * @param projectiles An array of projectile data.
   */
  init(tabContents: Record<string, string>, projectiles: any[]): void {
    this.oldLength = projectiles.length;
    this.renderTabs(tabContents);
    this.attachEvents(tabContents);
  }

  /**
   * Renders the tabs using the provided tabContents.
   * @param tabContents Object mapping tab keys to their content.
   */
  renderTabs(tabContents: Record<string, string>): void {
    // Clear previous tabs
    this.container.innerHTML = '';

    // Create a tab for each key in tabContents
    Object.entries(tabContents).forEach(([key, content], index) => {
      const tab = document.createElement('div');
      tab.classList.add('tab');
      tab.setAttribute('data-tab', key);
      tab.textContent = key;

      // Set active state for the tab matching oldIndex
      if (index === this.oldIndex) {
        tab.classList.add('active');
        this.tabText.textContent = content;
      }

      this.container.appendChild(tab);
    });
  }

  /**
   * Attaches click event listeners to all tabs.
   * @param tabContents Object mapping tab keys to their content.
   */
  attachEvents(tabContents: Record<string, string>): void {
    const tabs = this.container.querySelectorAll('.tab');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove 'active' class from all tabs
        tabs.forEach(t => t.classList.remove('active'));

        // Activate the clicked tab
        tab.classList.add('active');

        // Retrieve the data attribute to determine which content to display
        const tabId = tab.getAttribute('data-tab');
        if (tabId) {
          // Regex to extract number from the tabId (if applicable)
          const match = tabId.match(/\d+/);
          if (match) {
            this.oldIndex = parseInt(match[0], 10);
          }
          this.tabText.textContent = tabContents[tabId] || '';
        }
      });
    });
  }

  /**
   * Updates the tabs if the projectile array has changed.
   * @param tabContents Object mapping tab keys to their content.
   * @param projectiles The updated projectile data.
   */
  update(tabContents: Record<string, string>, projectiles: any[]): void {
    if (projectiles.length !== this.oldLength) {
      this.oldLength = projectiles.length;
      this.renderTabs(tabContents);
      this.attachEvents(tabContents);
    }
  }
}
