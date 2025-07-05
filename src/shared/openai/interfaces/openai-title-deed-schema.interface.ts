export interface PropertySchemaOwner {
  name: string;
  share: number;
  ownerNumber: string;
}

export interface PropertySchemaTransactionAmount {
  value: number;
  currency: string;
}

export interface PropertySchemaTransactionDetail {
  purchasedFrom: string;
  landRegistrationNumber: string;
  transactionDate: string;
  amount: PropertySchemaTransactionAmount;
  amountInWords: string;
}

export interface PropertySchemaMortgageStatus {
  mortgagedInFavorOf: string;
  status: string;
}

export interface PropertySchemaDigitalCertificateInfo {
  secureStorage: string;
  electronicIssues: string;
  changePolicy: string;
  holderPolicy: string;
}

export interface TitleDeedSchema {
  documentType: string;
  propertyType: string;
  community: string;
  buildingName: string;
  buildingNumber: string;
  plotNumber: string;
  floorNumber: string;
  parkingNumber: string;
  unitNumber: string;
  commonAreaSquareMeter: number;
  areaSquareMeter: number;
  totalAreaSquareFeet: number;
  suiteArea: number;
  balconyArea: number;
  parking: string;
  hasParkingSpace: boolean;
  isMortgaged: boolean;
  municipalityNumber: string;
  issueDate: string;
  owners: PropertySchemaOwner[];
  transactionDetails: PropertySchemaTransactionDetail;
  mortgageStatus: PropertySchemaMortgageStatus;
  digitalCertificateInfo: PropertySchemaDigitalCertificateInfo;
  additionalInfo: Record<string, unknown>;
}
