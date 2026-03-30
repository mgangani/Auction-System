import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";

export function IsDateAfter(property: string, options?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: "isDateAfter",
      target: object.constructor,
      propertyName,
      constraints: [property],
      options,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedProperty] = args.constraints;
          const relatedValue = (args.object as any)[relatedProperty];

          return new Date(value) > new Date(relatedValue);
        },
      },
    });
  };
}
