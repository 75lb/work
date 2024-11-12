class Command {
  state
  result

  /**
   * Must be async - sync commands don't support concurrency.
   */
  async execute () {}
}

export default Command
