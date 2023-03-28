import React, { FunctionComponent, useState, useEffect, EventHandler } from 'react';

import { CheckoutRequestBody, CheckoutSelectors } from '@bigcommerce/checkout-sdk';
import { CheckoutContextProps, withCheckout } from '../checkout';
import { LoadingOverlay } from '@bigcommerce/checkout/ui';

export interface WithCheckoutGiftMessageProps {
  updateCheckout(payload: CheckoutRequestBody): Promise<CheckoutSelectors>;
  checkoutService: any;
}

const GiftMessageSection: FunctionComponent<WithCheckoutGiftMessageProps> = (
  props: WithCheckoutGiftMessageProps,
) => {
  const getCheckout: Function = props?.checkoutService?.getState()?.data?.getCheckout;

  const currentCustomerMessage: String = getCheckout()?.customerMessage;

  let messageToShow = '';
  if (
    currentCustomerMessage.includes('Gift Message:') &&
    currentCustomerMessage.split('Gift Message:').length > 1
  ) {
    messageToShow = currentCustomerMessage.split('Gift Message:')[1]?.trim();
  }

  const [giftMessage, setGiftMessage] = useState(messageToShow);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange: any = (message: string) => {
    setGiftMessage(message ?? '');
  };

  const updateOrderComment: Function = async (comment: string) => {
    const currentCustomerMessage: String = getCheckout()?.customerMessage;

    if (currentCustomerMessage.trim() !== comment.trim()) {
        // Initiate API call and show the loader
        setIsLoading(true);
        await props.updateCheckout({ customerMessage: comment?.trim() ?? '' });

        // Recieve API call response and hide the loader
        setIsLoading(false);
    }
  };

  const handleBlur: Function = () => {
    const currentCustomerMessage: String = getCheckout()?.customerMessage;
    const messageText: string = giftMessage.length > 0 ? giftMessage.trim() : '';
    const messageToAdd: string =
      messageText.length > 200 ? messageText.split('').splice(0, 200).join('') : messageText;
    const giftMessageToAdd: string =
      messageToAdd?.trim().length > 0 ? `Gift Message: \n${messageToAdd}\n\n` : '';
    if (!currentCustomerMessage) {
      updateOrderComment(giftMessageToAdd);
    } else {
      if (
        currentCustomerMessage.includes('Ship Later Date:') &&
        !currentCustomerMessage.includes('Gift Message:')
      ) {
        const newCustomerMessage = `${currentCustomerMessage.trim()}\n\n${giftMessageToAdd}\n\n`;
        updateOrderComment(newCustomerMessage);
      } else if (
        currentCustomerMessage.includes('Ship Later Date:') &&
        currentCustomerMessage.includes('Gift Message:')
      ) {
        const newCustomerMessage = `${currentCustomerMessage
          .split('Gift Message:')[0]
          .trim()}\n\n${giftMessageToAdd}\n\n`;
        updateOrderComment(newCustomerMessage);
      } else {
        updateOrderComment(giftMessageToAdd);
      }
    }
  }

  return (
    <section className="gift-message-section-container">
      <h4 className="gift-message-heading">
        Gift Message - Add a gift message. Limit of 200 characters.
      </h4>

      <LoadingOverlay isLoading={isLoading}>
        <div className="custom-datepicker-wrapper">
          <div className="custom-datepicker-input-wrapper">
            <textarea
              id="custom-gift-message"
              maxLength={200}
              rows={3}
              className="form-input optimizedCheckout-form-input"
              onBlur={() => handleBlur()}
              onChange={(e: any) => handleChange(e?.target?.value)}
              value={giftMessage}
            />
          </div>
        </div>
      </LoadingOverlay>
    </section>
  );
};

export function mapToGiftMessageProps({
  checkoutService,
}: CheckoutContextProps): WithCheckoutGiftMessageProps | null {
  return {
    updateCheckout: checkoutService.updateCheckout,
    checkoutService: checkoutService,
  };
}

export default withCheckout(mapToGiftMessageProps)(GiftMessageSection);
