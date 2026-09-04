import { ApiError } from '../../utils/ApiError.js';
import * as repo from '../../repositories/immigrationProgram.repository.js';

export const listPrograms = (query) => repo.listPublic(query);
export const getFilterOptions = () => repo.getFilterOptions();
export const getProgram = async (id) => {
  const program = await repo.findPublicById(id);
  if (!program) throw ApiError.notFound('Immigration program not found.');
  return program;
};
