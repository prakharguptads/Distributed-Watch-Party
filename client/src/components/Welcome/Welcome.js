import React, { useState } from 'react';
import { createConnection } from '../../utils/socket';
import { Container, Row, Col, Hidden } from 'react-grid-system';
import styled from 'styled-components';
import Topbar from '../common/Topbar';
import StartForm from './StartForm';
import FeatureBox from './FeatureBox';
import { Button } from '../common';
import { colors } from '../../config/colors';
import { getVideoId } from '../../utils/helper';

function Welcome(props) {
	// const [canRedirectToRoom, setRedirect] = useState(false);
	let formEnd = null;
	const [hostLoading, setHostLoading] = useState(false);

	const scrollToForm = () => {
		if (formEnd) {
			formEnd.scrollIntoView({ behavior: 'smooth' });
		}
	};

	const onHost = async (username, videoUrl) => {
		// use socket id as room address
		setHostLoading(true);
		const videoId = getVideoId(videoUrl);
		const socket = await createConnection(username, null, videoId);
		console.log("ddd")
		setHostLoading(false);

		props.history.push({
			pathname: `/room/${socket.id}`, // socket.id === roomid
			state: { hostId: socket.id, username, videoId },
			socket,
		});
	};

	const onJoin = (username, joinUrl) => {
		// TODO: Add verification for join url
		const splitUrl = joinUrl.split('/');
		const roomId = splitUrl[splitUrl.length - 1];
		console.log("joinURL ",joinUrl)
		props.history.push({
			pathname: `/room/${roomId}`,
			state: { username , joinUrl },
		});
	};

	return (
		<React.Fragment>
			<Topbar />
			<Container fluid style={{ height: '92vh' }}>
				{/* topbar is 8vh in height, so (100 - 8) = 92 */}
				<Row style={{ paddingTop: '160px' }} align='center'>
					<Hidden xs>
						<Col xs={2}></Col>
					</Hidden>

					{/* --------- Intro Message -------- */}
					<Col>
						<IntroMessage>
							Organise{' '}
							<span style={{ color: 'red' }}>
								Youtube
							</span>{' '}
							Watch Party with Friends & Family
						</IntroMessage>
						<Button
							style={styles.heroButton}
							onClick={scrollToForm}
							primary
						>
							Get Started
						</Button>
					</Col>

					{/* <Col>
						<FeatureBox />
					</Col> */}

					<Hidden xs>
						<Col xs={2}></Col>
					</Hidden>
				</Row>
				
			</Container>

			<Container fluid>
				<Row align='center' style={styles.formContainer}>
					<Col md={2}></Col>
					<StartForm
						onHost={onHost}
						onJoin={onJoin}
						hostLoading={hostLoading}
					/>
					<Col md={2}></Col>
					<div className='dummy' ref={(el) => (formEnd = el)}></div>
				</Row>
			</Container>
		</React.Fragment>
	);
}

const IntroMessage = styled.h1`
	font-weight: 500;
	margin: 0;
	padding: 0;
	font-size: 2.5em;
`;

const styles = {
	formContainer: {
		backgroundImage: 'linear-gradient(#f9f9f9, #fff)',
		marginBottom: '40px',
		zIndex: 10,
		height: '100vh',
	},
	heroButton: {
		margin: '15px 0',
		minWidth: '200px',
		padding: '15px 10px',
	},
};

export default Welcome;
