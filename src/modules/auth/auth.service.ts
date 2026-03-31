import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../../config/database";
import { User } from "../../entity/User";
import { RegisterDto, LoginDto } from "./auth.dto";
import { v4 as uuidv4 } from "uuid";
import { UserRole } from "../../types/enums";
import dotenv from "dotenv";
dotenv.config();

const userRepo = AppDataSource.getRepository(User);

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

export class AuthService {
  async register(data: RegisterDto) {
    const existing = await userRepo.findOne({ where: { email: data.email } });

    if (existing) {
      throw new Error("Email already in use");
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = userRepo.create({
      name: data.name,
      email: data.email,
      password_hash: hashedPassword,
      role: UserRole.USER,
    });

    await userRepo.save(user);

    return this.generateTokens(user);
  }

  async login(data: LoginDto) {
    const user = await userRepo.findOne({ where: { email: data.email } });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.password_hash) {
      throw new Error("Use Google login");
    }

    const isMatch = await bcrypt.compare(data.password, user.password_hash);

    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    return this.generateTokens(user);
  }

  async refresh(refreshToken: string) {
    try {
      const payload: any = jwt.verify(refreshToken, REFRESH_SECRET);

      // 🔴 Always re-fetch user (important for role updates)
      const user = await userRepo.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new Error("User not found");
      }

      return this.generateTokens(user);
    } catch {
      throw new Error("Invalid refresh token");
    }
  }

  async logout(token: string) {
    const decoded: any = jwt.decode(token);

    if (!decoded?.jti || !decoded?.exp) return;

    const ttl = decoded.exp - Math.floor(Date.now() / 1000);

    // Redis later
    console.log(`Blacklist token ${decoded.jti} for ${ttl}s`);
  }

  async googleLogin(profile: {
    email: string;
    name: string;
    googleId: string;
  }) {
    // 1. Try find by google_id first (strong identity)
    let user = await userRepo.findOne({
      where: { google_id: profile.googleId },
    });

    // 2. If not found, try email (account linking)
    if (!user) {
      user = await userRepo.findOne({
        where: { email: profile.email },
      });

      if (user) {
        // 🔗 Link Google account
        user.google_id = profile.googleId;
        user.provider = "GOOGLE";
        await userRepo.save(user);
      }
    }

    // 3. If still not found → create
    if (!user) {
      user = userRepo.create({
        name: profile.name,
        email: profile.email,
        google_id: profile.googleId,
        provider: "GOOGLE",
        role: UserRole.USER,
      });

      await userRepo.save(user);
    }

    return this.generateTokens(user);
  }

  private generateTokens(user: User) {
    const accessJti = uuidv4();
    const refreshJti = uuidv4();

    const accessToken = jwt.sign(
      {
        sub: user.id,
        jti: accessJti,
        type: "access",
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: "15m" },
    );

    const refreshToken = jwt.sign(
      {
        sub: user.id,
        jti: refreshJti,
        type: "refresh",
      },
      REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
}
