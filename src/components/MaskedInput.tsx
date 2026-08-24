import React from 'react';
import InputMask from 'react-input-mask';

interface MaskedInputProps {
  mask: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
  name?: string;
}

export const MaskedInput: React.FC<MaskedInputProps> = ({
  mask,
  value,
  onChange,
  placeholder,
  className = '',
  name,
}) => {
  return (
    <InputMask
      mask={mask}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      name={name}
    />
  );
};

export const CPFInput: React.FC<Omit<MaskedInputProps, 'mask'>> = (props) => (
  <MaskedInput mask="999.999.999-99" {...props} />
);

export const CNPJInput: React.FC<Omit<MaskedInputProps, 'mask'>> = (props) => (
  <MaskedInput mask="99.999.999/9999-99" {...props} />
);

export const PhoneInput: React.FC<Omit<MaskedInputProps, 'mask'>> = (props) => (
  <MaskedInput mask="(99) 99999-9999" {...props} />
);

export const CEPInput: React.FC<Omit<MaskedInputProps, 'mask'>> = (props) => (
  <MaskedInput mask="99999-999" {...props} />
);

export const DateInput: React.FC<Omit<MaskedInputProps, 'mask'>> = (props) => (
  <MaskedInput mask="99/99/9999" {...props} />
);
