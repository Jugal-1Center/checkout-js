import React, { FunctionComponent, useState, useEffect, createRef, MouseEventHandler } from 'react';

import { CheckoutRequestBody, CheckoutSelectors } from '@bigcommerce/checkout-sdk';
import { CheckoutContextProps, withCheckout } from '../checkout';
import ReactDatePicker from 'react-datepicker';
import { LoadingOverlay } from '@bigcommerce/checkout/ui';

interface DateProps {
  date: null | Date;
}

export interface WithCheckoutShippingProps {
  updateCheckout(payload: CheckoutRequestBody): Promise<CheckoutSelectors>;
  checkoutService: any;
}

const ShippingDateSection: FunctionComponent<WithCheckoutShippingProps> = (
  props: WithCheckoutShippingProps,
) => {
  const getCheckout: Function = props?.checkoutService?.getState()?.data?.getCheckout;
  
  let currentCustomerMessage: string = getCheckout()?.customerMessage;

  if (currentCustomerMessage && currentCustomerMessage.includes('Gift Message:')) {
    currentCustomerMessage = currentCustomerMessage.split('Gift Message:')[0].trim()
  }

  const currentDateSplitted: any = currentCustomerMessage?.split(':');
  let currentDateString: string =
    currentDateSplitted.length > 1 ? (currentDateSplitted[1].includes('to') ? currentDateSplitted[1].split('to')[0].trim() : '') : '';
  const [
    month,
    date,
    year
  ] = currentDateString?.split('/') ?? null;

  let newDateObj: Date | null = null;
  if (month && date && year) {
    newDateObj = new Date(`${year}-${month}-${date}`);
  }

  const [selectedDate, setSelectedDate] = useState<DateProps>({ date: newDateObj });
  const [finalDateData, setFinalDateData] = useState(
    currentCustomerMessage?.replaceAll('Ship Later Date:', '').trim() ?? ''
  );
  const [ isLoading, setIsLoading ] = useState(false);

  const parseDate = (dateObj: Date) =>
    `${('0' + (dateObj.getMonth() + 1)).slice(-2)}/${('0' + dateObj.getDate()).slice(
      -2,
    )}/${dateObj.getFullYear()}`;

  const dateFormat: string = 'mm/dd/yy';
  const currentDateObj: Date = new Date();
  currentDateObj.setDate(currentDateObj.getDate() + 15);

  const inputElRef: any = createRef<HTMLInputElement>();

  const handleChange: any = (date: Date) => {
    setSelectedDate({ date: date });

    const endDate: Date = new Date(date.toString());
    endDate.setDate(date.getDate() + 7);
    const finalDateDataString: string = `${parseDate(date)} to ${parseDate(endDate)}`;
    setFinalDateData(finalDateDataString);
  };

  const resetDate: MouseEventHandler = () => {
    setSelectedDate({ date: null });
    const currentCustomerMessage: string = getCheckout()?.customerMessage;
    const giftMessage = currentCustomerMessage.split('Gift Message:')[1] ?? '';
    const newMessage = currentCustomerMessage.includes('Gift Message:')
      ? giftMessage ? `Gift Message:\n${giftMessage.trim()}\n\n` : ''
      : '';
    setFinalDateData('');
    updateOrderComment(newMessage);
  };

  const handleClick: MouseEventHandler = () => inputElRef?.current?.input?.click();

  const updateOrderComment: Function = async (comment: string) => {
    const currentCustomerMessage: string = getCheckout()?.customerMessage;

    if (currentCustomerMessage.trim() !== comment.trim()) {
      // Initiate API call and show the loader
      setIsLoading(true);
      await props.updateCheckout({ customerMessage: comment });
  
      // Recieve API call response and hide the loader
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (finalDateData?.trim()) {
      const currentCustomerMessage = getCheckout()?.customerMessage;
      const shippingMessageToAdd = `Ship Later Date: \n${finalDateData}\n\n`;
      if (!currentCustomerMessage) {
        updateOrderComment(shippingMessageToAdd);
      } else {
        if (currentCustomerMessage.includes('Gift Message:')) {
          const giftMessage: string = currentCustomerMessage.split('Gift Message:')[1];
          const newCustomerMessage = `${shippingMessageToAdd.trim()}\n\n${giftMessage?.trim() ? 'Gift Message:\n' + giftMessage?.trim() : ''}\n\n`;
          updateOrderComment(newCustomerMessage);
        } else {
          updateOrderComment(shippingMessageToAdd);
        }
      }
    }
  }, [selectedDate.date, finalDateData]);

  return (
    <section className="shipping-date-section-container">
      <h4 className="shipping-date-heading">
        Shipping Date(Optional if nothing selected we will ship ASAP)
      </h4>

      <LoadingOverlay isLoading={isLoading}>
        <div className="custom-datepicker-wrapper">
          <div className="custom-datepicker-input-wrapper" onClick={handleClick}>
            <input
              type="text"
              id="custom-datepicker-input"
              className="form-input optimizedCheckout-form-input"
              placeholder={dateFormat.toUpperCase()}
              disabled
              value={finalDateData}
            />
          </div>

          <ReactDatePicker
            ref={inputElRef}
            autoComplete="off"
            calendarClassName="optimizedCheckout-contentPrimary"
            className={'form-input optimizedCheckout-form-input'}
            minDate={currentDateObj}
            placeholderText={dateFormat.toUpperCase()}
            popperClassName="optimizedCheckout-contentPrimary"
            selected={selectedDate.date ?? null}
            onChange={(date: Date) => handleChange(date)}
          />
        </div>

        <button
          className="button button--primary optimizedCheckout-buttonPrimary"
          onClick={resetDate}
        >
          Reset
        </button>
      </LoadingOverlay>
    </section>
  );
};

export function mapToShippingDateProps({ checkoutService }: CheckoutContextProps): WithCheckoutShippingProps | null {
  return {
    updateCheckout: checkoutService.updateCheckout,
    checkoutService: checkoutService
  };
}

export default withCheckout(mapToShippingDateProps)(ShippingDateSection);
