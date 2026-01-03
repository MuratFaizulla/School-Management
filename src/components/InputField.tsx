import { FieldError } from "react-hook-form";

type InputFieldProps = {
  label: string;
  type?: string;
  register: any;
  name: string;
  defaultValue?: string;
  error?: FieldError;
  hidden?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
};
const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  hidden,
  inputProps,
}: InputFieldProps) => {
  if (hidden) {
    return (
      <input
        type="hidden"
        {...register(name)}
        defaultValue={defaultValue}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 w-full">
      <label className="text-xs text-gray-500">{label}</label>

      <input
        type={type}
        {...register(name)}
        className="w-full ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm"
        {...inputProps}
        defaultValue={defaultValue}
      />

      {error?.message && (
        <p className="text-xs text-red-400">
          {error.message.toString()}
        </p>
      )}
    </div>
  );
};

export default InputField;