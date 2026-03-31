import Users from "../dao/userDAO.js";
import Mileage from "../dao/mileageDAO.js";
import Truck from "../dao/truckDAO.js";
import Assignment from "../dao/assignmentDAO.js";

import UserRepository from "../repository/UserRepository.js";
import MileageRepository from "../repository/MileageRepository.js";
import TruckRepository from "../repository/TruckRepository.js";
import AssignmentRepository from "../repository/assignmentRepository.js";

export const usersService = new UserRepository(new Users())
export const mileageService = new MileageRepository(new Mileage())
export const truckService = new TruckRepository(new Truck())
export const assignmentService = new AssignmentRepository(new Assignment())
