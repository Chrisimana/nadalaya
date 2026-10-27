export class GalatRute extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly kode?: string,
    readonly header?: Record<string, string>,
  ) {
    super(message);
    this.name = "GalatRute";
  }
}
