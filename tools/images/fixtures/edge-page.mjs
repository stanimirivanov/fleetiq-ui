/** Small package-smoke page object; product journeys remain in web-e2e. */
export class EdgePage {
  constructor(page) {
    this.page = page;
    this.themeButton = page.getByRole('button', { name: /^Theme:/u });
  }
  async open(path = '/') {
    await this.page.goto(path);
  }
  async toggleTheme() {
    await this.themeButton.click();
  }
}
