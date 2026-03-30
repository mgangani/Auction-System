import { AppDataSource } from "../../config/database";
import { User } from "../../entity/User";
import { UserRole } from "../../types/enums";

const userRepo = AppDataSource.getRepository(User);

export class UserService {
  async getProfile(userId: string) {
    const user = await userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async updateRole(userId: string, role: UserRole) {
    const user = await userRepo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.role === UserRole.SUPERADMIN) {
      throw new Error("Cannot modify superadmin");
    }

    user.role = role;

    await userRepo.save(user);

    return {
      message: "Role updated successfully",
    };
  }
}
