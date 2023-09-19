import { Address, Enrollment } from '@prisma/client';
import { AxiosResponse } from 'axios';

import { requestError } from '@/errors';

import { addressRepository, CreateAddressParams, enrollmentRepository, CreateEnrollmentParams } from '@/repositories';

import { request } from '@/utils/request';
import { exclude } from '@/utils/prisma-utils';
import extractType from '@/utils/extractType';

async function getAddressFromCEP(cep: string): Promise<CepInfo> {
  const result = await requestCep(cep);

  if (result?.data?.erro) {
    throw requestError(400, 'CEP not found');
  }
  result.data.cidade = result.data.localidade;
  delete result.data.localidade;
  const response: CepInfo = extractType<CepInfo>(result.data as CepInfo, [
    'logradouro',
    'complemento',
    'bairro',
    'cidade',
    'uf',
  ]);

  return response;
}

export type CepInfo = {
  logradouro: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
};

async function getOneWithAddressByUserId(userId: number): Promise<GetOneWithAddressByUserIdResult> {
  const enrollmentWithAddress = await enrollmentRepository.findWithAddressByUserId(userId);

  if (!enrollmentWithAddress) throw requestError(400, 'User with CEP not found');

  const [firstAddress] = enrollmentWithAddress.Address;
  const address = getFirstAddress(firstAddress);

  return {
    ...exclude(enrollmentWithAddress, 'userId', 'createdAt', 'updatedAt', 'Address'),
    ...(!!address && { address }),
  };
}

type GetOneWithAddressByUserIdResult = Omit<Enrollment, 'userId' | 'createdAt' | 'updatedAt'>;

function getFirstAddress(firstAddress: Address): GetAddressResult {
  if (!firstAddress) return null;

  return exclude(firstAddress, 'createdAt', 'updatedAt', 'enrollmentId');
}

type GetAddressResult = Omit<Address, 'createdAt' | 'updatedAt' | 'enrollmentId'>;

async function createOrUpdateEnrollmentWithAddress(params: CreateOrUpdateEnrollmentWithAddress) {
  const enrollment = exclude(params, 'address');
  enrollment.birthday = new Date(enrollment.birthday);
  const address = getAddressForUpsert(params.address);

  const response: AxiosResponse = await requestCep(params.address.cep); //If cep is not valid, error will be thrown
  if (response?.data.erro) {
    throw requestError(400, 'CEP not valid');
  }
  const newEnrollment = await enrollmentRepository.upsert(params.userId, enrollment, exclude(enrollment, 'userId'));

  await addressRepository.upsert(newEnrollment.id, address, address);
}

function getAddressForUpsert(address: CreateAddressParams) {
  return {
    ...address,
    ...(address?.addressDetail && { addressDetail: address.addressDetail }),
  };
}

function requestCep(cep: string): Promise<AxiosResponse> {
  return request.get(`${process.env.VIA_CEP_API}/${cep}/json/`);
}

export type CreateOrUpdateEnrollmentWithAddress = CreateEnrollmentParams & {
  address: CreateAddressParams;
};

export const enrollmentsService = {
  getOneWithAddressByUserId,
  createOrUpdateEnrollmentWithAddress,
  getAddressFromCEP,
};
