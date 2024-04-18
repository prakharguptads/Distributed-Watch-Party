import React from 'react';
import styled from 'styled-components';
import { colors } from '../../config/colors';

const Footer = (props) => (
	<StyledFooter>
		<div>
			Made By : Prakhar, Aryan, Shivani
		</div>
	</StyledFooter>
);

const StyledFooter = styled.div`
	height: 45px;
	margin-top: -45px;
	display: flex;
	flex-direction: column;
	position: relative;
	flex: 1;
	align-items: center;
	justify-content: center;
	font-size: 0.9em;
	font-weight: 500;
	flex-wrap: wrap;
	padding: 0 5%;
	text-align: center;
`;

export default Footer;
