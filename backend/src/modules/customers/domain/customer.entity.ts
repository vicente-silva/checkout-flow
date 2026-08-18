export class Customer {
  constructor(
    public readonly id: string,
    public readonly fullName: string,
    public readonly email: string,
    public readonly phoneNumber: string,
    public readonly documentType: string,
    public readonly documentNumber: string,
  ) {}
}
