import dotenv from 'dotenv'
dotenv.config()
import userModel from "../models/user_model.js";
import bcrypt from "bcrypt";
import * as uuid from "uuid";
import mailService from "./mail-service.js";
import tokenService from "./token-service.js";
import UserDto from '../dtos/user-dto.js'
import ApiError from "../exceptions/api-error.js";

class userService {
    async registration(email, password) {
        const candidate = await userModel.findOne({email})
        if (candidate) {
            throw ApiError.BadRequest(`Пользователь с почтовым адресом ${email} существует`)
        }
        const hashPassword = await bcrypt.hash(password, 7)
        const activationLink = uuid.v4()

        const user = await userModel.create({email, password: hashPassword, activationLink})
        // await mailService.sendActivationMail(email, `${process.env.API_URL}/api/activate/${activationLink}`)

        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({...userDto})
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return {...tokens, user: userDto}
    }

    async login(email, password) {
        const user = await userModel.findOne({email})
        if (!user) {
            throw ApiError.BadRequest(`Пользователя с почтовым адресом ${email} не существует`)
        }

        const isPasswordEquals = await bcrypt.compare(password, user.password)
        if (!isPasswordEquals) {
            throw ApiError.BadRequest(`Неверный пароль`)
        }

        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({...userDto})
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return {...tokens, user: userDto}
    }

    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken)
        return token
    }

    async activate(activationLink) {
        const user = await userModel.findOne({activationLink})
        if (!user) {
            throw new ApiError.BadRequest('Неккоректная ссылка активации')
        }
        user.isActivated = true
        await user.save()
    }

    async refresh(refreshToken) {
        if(!refreshToken) {
            throw ApiError.UnauthorizedError()
        }
        const userData = tokenService.validateRefreshToken(refreshToken)
        const tokenFromDb = await tokenService.findToken(refreshToken)
        if (!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError()
        }
        const user = await userModel.findById(userData.id)
        const userDto = new UserDto(user)
        const tokens = tokenService.generateTokens({...userDto})
        await tokenService.saveToken(userDto.id, tokens.refreshToken)

        return {...tokens, user: userDto}
    }

    async getAllUsers() {
        const users = await userModel.find()
        return users
    }

}

export default new userService()